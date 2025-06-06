const CallToActions = () => {
  return (
    <section className="section-bg layout-pt-lg layout-pb-lg">
      <div className="section-bg__item -mx-20 bg-blue-1"></div>

      <div className="container">
        <div className="row items-center justify-center text-center">
          <div className="col-auto" data-aos="fade-up" data-aos-delay="100">
            <i className="icon-newsletter text-60 sm:text-40 text-white" />
            <h2 className="text-30 sm:text-24 lh-15 text-white mt-20">
              Votre voyage commence ici
            </h2>
            <p className="text-white mt-5">
              Inscrivez-vous et nous vous enverrons les meilleures offres
            </p>

            <form className="single-field -w-410 d-flex x-gap-10 flex-wrap y-gap-20 pt-30">
              <div className="col-auto">
                <input
                  className="col-12 bg-white h-60"
                  type="text"
                  placeholder="Your Email"
                  required
                />
              </div>
              {/* End .col */}

              <div className="col-auto">
                <button
                  type="submit"
                  className="button -md -white h-60 bg-dark-1 text-white"
                >
                  Subscribe
                </button>
              </div>
              {/* End .col */}
            </form>
          </div>
        </div>
      </div>
      {/* End .container */}
    </section>
  );
};

export default CallToActions;
